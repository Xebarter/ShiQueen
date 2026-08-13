import type { Metadata } from 'next';
import { ServiceDetailPage } from '@/components/services/service-detail-page';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${title} | Services`,
    description: `Book ${title} with trusted ShiQueen service providers.`,
  };
}

export default async function ServiceDetailRoute({ params }: Props) {
  const { slug } = await params;
  return <ServiceDetailPage slug={slug} />;
}
