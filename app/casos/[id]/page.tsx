import CaseSolver from "../../../components/CaseSolver";

export default async function ResolverCasoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CaseSolver id={id} />;
}
