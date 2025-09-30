import { prisma } from "@/lib/prisma";

export default async function Home() {
  const users = await prisma.userDetails.findFirst();
  if (!users) return null;
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <ul>
          <li key={users.id}>
            {users.name} - {users.email}
          </li>
        </ul>
      </main>
    </div>
  );
}
