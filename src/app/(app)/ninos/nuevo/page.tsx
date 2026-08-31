import { CreateChildForm } from "./create-child-form";

export default async function NewChildPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const { groupId } = await searchParams;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Agregar niño</h1>
      <CreateChildForm groupId={groupId ?? ""} />
    </div>
  );
}
