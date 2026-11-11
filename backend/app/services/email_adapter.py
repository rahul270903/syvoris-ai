import os
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from app.core.config import settings

logger = logging.getLogger("syvoris.email")

class BaseEmailAdapter(ABC):
    @abstractmethod
    async def send_welcome_email(self, to_email: str, org_name: str, verification_token: str) -> bool:
        pass

    @abstractmethod
    async def send_password_reset_email(self, to_email: str, reset_token: str) -> bool:
        pass

    @abstractmethod
    async def send_user_invitation(self, to_email: str, org_name: str, inviter_name: str, temp_token: str) -> bool:
        pass

class DevEmailAdapter(BaseEmailAdapter):
    """
    Explicit development email adapter.
    Records transactional email contents, verification links, and reset tokens
    to structured application logs and a local persistent file so developer workflows
    can be verified end-to-end without active third-party SMTP credentials.
    """
    def __init__(self, log_path: str = settings.DEV_EMAIL_LOG_PATH):
        self.log_path = log_path
        os.makedirs(os.path.dirname(self.log_path) if os.path.dirname(self.log_path) else ".", exist_ok=True)

    def _write_record(self, email_type: str, to_email: str, content: str):
        timestamp = datetime.now(timezone.utc).isoformat()
        entry = (
            f"================================================================================\n"
            f"[{timestamp}] EMAIL TYPE: {email_type}\n"
            f"TO: {to_email}\n"
            f"CONTENT:\n{content}\n"
            f"================================================================================\n\n"
        )
        logger.info(f"[DEV EMAIL ADAPTER] Sent {email_type} to {to_email}")
        try:
            with open(self.log_path, "a", encoding="utf-8") as f:
                f.write(entry)
        except Exception as e:
            logger.warning(f"Failed to append dev email to file: {e}")

    async def send_welcome_email(self, to_email: str, org_name: str, verification_token: str) -> bool:
        content = (
            f"Welcome to SYVORIS Ai Enterprise CRM!\n"
            f"Your organization '{org_name}' has been provisioned.\n"
            f"Verification Token: {verification_token}\n"
            f"Verification Link: http://localhost:5173/verify-email?token={verification_token}"
        )
        self._write_record("WELCOME_AND_VERIFY", to_email, content)
        return True

    async def send_password_reset_email(self, to_email: str, reset_token: str) -> bool:
        content = (
            f"SYVORIS Ai Password Reset Request\n"
            f"Reset Token: {reset_token}\n"
            f"Reset Link: http://localhost:5173/reset-password?token={reset_token}\n"
            f"This link is valid for {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes."
        )
        self._write_record("PASSWORD_RESET", to_email, content)
        return True

    async def send_user_invitation(self, to_email: str, org_name: str, inviter_name: str, temp_token: str) -> bool:
        content = (
            f"Invitation to join '{org_name}' on SYVORIS Ai\n"
            f"Invited by: {inviter_name}\n"
            f"Invitation Token: {temp_token}\n"
            f"Accept Link: http://localhost:5173/accept-invite?token={temp_token}"
        )
        self._write_record("USER_INVITATION", to_email, content)
        return True

email_service = DevEmailAdapter()
