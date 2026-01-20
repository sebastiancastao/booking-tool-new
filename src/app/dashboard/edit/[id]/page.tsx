import { WidgetCreator } from "@/components/widget/WidgetCreator";

interface EditWidgetPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditWidgetPage({ params }: EditWidgetPageProps) {
  const { id } = await params;
  return <WidgetCreator widgetId={id} />;
}
