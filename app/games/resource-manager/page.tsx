import { Metadata } from 'next';
import ResourceManager from '@/components/games/resource-manager';

export const metadata: Metadata = {
  title: 'Resource Manager - Economic Strategy Game | Mini Games',
  description: 'Build and manage your economic empire. Collect resources, construct buildings, and meet challenging economic goals.',
  keywords: 'resource management, economic strategy, building game, tycoon game, management simulation',
};

export default function ResourceManagerPage() {
  return <ResourceManager />;
}