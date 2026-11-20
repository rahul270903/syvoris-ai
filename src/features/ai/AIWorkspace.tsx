import { ConversationalCopilotView } from './ConversationalCopilotView';
import { AgentWorkforceView } from './AgentWorkforceView';
import { AgentOrgChartView } from './AgentOrgChartView';
import { AgentMarketplaceView } from './AgentMarketplaceView';
import { AIActivityQueueView } from './AIActivityQueueView';
import { AIRecommendationsView } from './AIRecommendationsView';
import { RevenueDigitalTwinView } from './RevenueDigitalTwinView';
import { CustomerIntelligenceView } from './CustomerIntelligenceView';
import { AIGovernanceView } from './AIGovernanceView';
import { AICommandCentreView } from './AICommandCentreView';

export function AIWorkspace({ path, title, description }: { path: string; title: string; description: string }) {
  if (path === '/ai/copilot') {
    return <ConversationalCopilotView />;
  }

  if (path === '/ai/agents') {
    return <AgentWorkforceView />;
  }

  if (path === '/ai/org-chart') {
    return <AgentOrgChartView />;
  }

  if (path === '/ai/marketplace') {
    return <AgentMarketplaceView />;
  }

  if (path === '/ai/activity') {
    return <AIActivityQueueView />;
  }

  if (path === '/ai/recommendations') {
    return <AIRecommendationsView />;
  }

  if (path === '/ai/revenue-twin') {
    return <RevenueDigitalTwinView />;
  }

  if (path === '/ai/customer-intelligence') {
    return <CustomerIntelligenceView />;
  }

  if (path === '/ai/governance') {
    return <AIGovernanceView />;
  }

  // Default to AI Command Centre Mission Control
  return <AICommandCentreView />;
}
