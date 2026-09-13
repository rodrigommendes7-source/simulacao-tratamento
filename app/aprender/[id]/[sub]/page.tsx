import PaginaSubtopico from "../../../../components/aprender/PaginaSubtopico";

export default async function AprenderSubtopicoPage({ params }: { params: Promise<{ id: string; sub: string }> }) {
  const { id, sub } = await params;
  return <PaginaSubtopico id={id} sub={sub} />;
}
