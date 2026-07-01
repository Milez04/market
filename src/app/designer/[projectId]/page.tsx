import { DesignerWorkbench } from "@/components/editor/designer-workbench";

export default async function DesignerPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <DesignerWorkbench projectId={projectId} />;
}
