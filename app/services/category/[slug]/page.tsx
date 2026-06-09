import { CategoryPage } from '@/components/services/category-page';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ServiceCategoryRoute({ params }: Props) {
  const { slug } = await params;
  return <CategoryPage slug={slug} />;
}
