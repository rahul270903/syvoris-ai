import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from app.models.service import ChatSession, ChatMessage, Case
from app.models.crm import Contact, Account
from app.schemas.service import (
    ChatSessionCreate,
    ChatSessionUpdate,
    ChatSessionResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ConvertChatToCaseRequest,
    CaseCreate,
    CaseResponse
)
from app.services.case_service import CaseService
from app.core.errors import NotFoundException, ValidationException
from app.services.audit_service import audit_service

class ChatService:
    """Service managing live support chat sessions, message streaming, and case conversions."""

    @staticmethod
    async def _generate_ref(db: AsyncSession, tenant_id: uuid.UUID) -> str:
        res = await db.execute(
            select(func.count()).select_from(ChatSession).where(ChatSession.tenant_id == tenant_id)
        )
        count = res.scalar() or 0
        year = datetime.now(timezone.utc).year
        return f"CHT-{year}-{count + 1:05d}"

    @staticmethod
    async def list_sessions(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[ChatSessionResponse]:
        stmt = (
            select(ChatSession)
            .where(ChatSession.tenant_id == tenant_id, ChatSession.deleted_at.is_(None))
            .options(selectinload(ChatSession.messages))
        )
        if status:
            stmt = stmt.where(ChatSession.status == status)
        stmt = stmt.order_by(desc(ChatSession.started_at)).limit(limit)

        res = await db.execute(stmt)
        sessions = res.scalars().all()

        results: List[ChatSessionResponse] = []
        for s in sessions:
            c_ref = None
            if s.converted_case_id:
                case_res = await db.execute(select(Case.ref).where(Case.id == s.converted_case_id))
                c_ref = case_res.scalar_one_or_none()

            item = ChatSessionResponse.model_validate(s)
            item.converted_case_ref = c_ref
            results.append(item)

        return results

    @staticmethod
    async def get_session(
        db: AsyncSession,
        session_id: uuid.UUID,
        tenant_id: uuid.UUID
    ) -> ChatSessionResponse:
        stmt = (
            select(ChatSession)
            .where(ChatSession.id == session_id, ChatSession.tenant_id == tenant_id, ChatSession.deleted_at.is_(None))
            .options(selectinload(ChatSession.messages))
        )
        res = await db.execute(stmt)
        s = res.scalar_one_or_none()
        if not s:
            raise NotFoundException("Chat session not found.")

        c_ref = None
        if s.converted_case_id:
            case_res = await db.execute(select(Case.ref).where(Case.id == s.converted_case_id))
            c_ref = case_res.scalar_one_or_none()

        item = ChatSessionResponse.model_validate(s)
        item.converted_case_ref = c_ref
        return item

    @staticmethod
    async def create_session(
        db: AsyncSession,
        session_in: ChatSessionCreate,
        tenant_id: uuid.UUID
    ) -> ChatSessionResponse:
        ref = await ChatService._generate_ref(db, tenant_id)
        session = ChatSession(
            tenant_id=tenant_id,
            ref=ref,
            contact_id=session_in.contact_id,
            account_id=session_in.account_id,
            assigned_user_id=session_in.assigned_user_id,
            assigned_user_name=session_in.assigned_user_name,
            visitor_name=session_in.visitor_name,
            visitor_email=session_in.visitor_email,
            status="Active",
            channel=session_in.channel,
            custom_fields=session_in.custom_fields
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)

        # If initial message provided, add it
        if session_in.initial_message:
            msg = ChatMessage(
                tenant_id=tenant_id,
                session_id=session.id,
                sender_type="visitor",
                sender_name=session_in.visitor_name,
                message_text=session_in.initial_message,
                custom_fields={}
            )
            db.add(msg)
            await db.commit()

        return await ChatService.get_session(db, session.id, tenant_id)

    @staticmethod
    async def send_message(
        db: AsyncSession,
        session_id: uuid.UUID,
        message_in: ChatMessageCreate,
        tenant_id: uuid.UUID
    ) -> ChatMessageResponse:
        stmt = select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.tenant_id == tenant_id,
            ChatSession.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        s = res.scalar_one_or_none()
        if not s:
            raise NotFoundException("Chat session not found.")

        msg = ChatMessage(
            tenant_id=tenant_id,
            session_id=session_id,
            sender_type=message_in.sender_type,
            sender_name=message_in.sender_name,
            message_text=message_in.message_text,
            custom_fields=message_in.custom_fields
        )
        db.add(msg)
        await db.commit()
        await db.refresh(msg)

        return ChatMessageResponse.model_validate(msg)

    @staticmethod
    async def update_session(
        db: AsyncSession,
        session_id: uuid.UUID,
        update_in: ChatSessionUpdate,
        tenant_id: uuid.UUID
    ) -> ChatSessionResponse:
        stmt = select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.tenant_id == tenant_id,
            ChatSession.deleted_at.is_(None)
        )
        res = await db.execute(stmt)
        s = res.scalar_one_or_none()
        if not s:
            raise NotFoundException("Chat session not found.")

        for key, val in update_in.model_dump(exclude_unset=True).items():
            setattr(s, key, val)

        if update_in.status == "Closed" and not s.ended_at:
            s.ended_at = datetime.now(timezone.utc)

        await db.commit()
        return await ChatService.get_session(db, s.id, tenant_id)

    @staticmethod
    async def convert_chat_to_case(
        db: AsyncSession,
        session_id: uuid.UUID,
        convert_in: ConvertChatToCaseRequest,
        tenant_id: uuid.UUID,
        actor_id: Optional[uuid.UUID] = None,
        actor_name: Optional[str] = None
    ) -> CaseResponse:
        session = await ChatService.get_session(db, session_id, tenant_id)
        if session.converted_case_id:
            return await CaseService.get_case(db, session.converted_case_id, tenant_id)

        # Assemble chat history text
        transcript_lines = [
            f"[{m.created_at.strftime('%H:%M:%S')}] {m.sender_name} ({m.sender_type}): {m.message_text}"
            for m in session.messages
        ]
        transcript_body = "\n".join(transcript_lines) if transcript_lines else "No messages recorded."

        subject = convert_in.subject or f"Live Chat Inquiry: {session.visitor_name}"
        description = f"Case automatically generated from live chat session {session.ref}.\n\n--- Chat Transcript ---\n{transcript_body}"

        case_in = CaseCreate(
            subject=subject,
            description=description,
            account_id=session.account_id,
            contact_id=session.contact_id,
            priority=convert_in.priority,
            category=convert_in.category,
            channel="Live Chat",
            assigned_user_id=convert_in.assigned_user_id,
            custom_fields={"chat_session_ref": session.ref, "chat_session_id": str(session.id)}
        )

        new_case = await CaseService.create_case(
            db=db,
            case_in=case_in,
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name
        )

        # Update chat session
        s_stmt = select(ChatSession).where(ChatSession.id == session_id)
        s_res = await db.execute(s_stmt)
        live_s = s_res.scalar_one()
        live_s.status = "Converted"
        live_s.converted_case_id = new_case.id
        live_s.ended_at = datetime.now(timezone.utc)
        await db.commit()

        await audit_service.log_event(
            db=db,
            action="chat.converted_to_case",
            resource_type="chat_session",
            resource_id=str(session_id),
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_name=actor_name,
            metadata={"session_ref": session.ref, "case_ref": new_case.ref}
        )

        return new_case
