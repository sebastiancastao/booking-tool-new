"use client";

import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromoCodeGenerator } from "@/components/dashboard/PromoCodeGenerator";

export default function PromoCodesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Promo Codes</h1>
                <p className="text-sm text-gray-700">Generate moving-word promo codes</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <PromoCodeGenerator />
      </main>
    </div>
  );
}
