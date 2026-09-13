import PaginaCategoria from "../../../components/aprender/PaginaCategoria";

export default async function AprenderCategoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PaginaCategoria id={id} />;
}
