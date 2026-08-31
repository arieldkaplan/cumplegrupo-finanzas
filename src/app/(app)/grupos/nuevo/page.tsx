import { CreateGroupForm } from "./create-group-form";

export default function NewGroupPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Crear grupo</h1>
      <CreateGroupForm />
    </div>
  );
}
