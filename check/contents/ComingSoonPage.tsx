'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";

type ComingSoonPageProps = {
  title: string;
  description: string;
};

export default function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      <p className="text-xl text-muted-foreground max-w-2xl mb-8">
        {description}
      </p>
      <Link href="/">
        <Button variant="outline" size="lg">
          Back to Home
        </Button>
      </Link>
    </div>
  );
}