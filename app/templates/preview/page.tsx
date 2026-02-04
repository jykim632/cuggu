"use client";

import { ClassicTemplate } from "@/components/templates/ClassicTemplate";
import { SAMPLE_INVITATION } from "@/schemas/invitation";

export default function TemplatePreviewPage() {
  return <ClassicTemplate data={SAMPLE_INVITATION} isPreview />;
}
