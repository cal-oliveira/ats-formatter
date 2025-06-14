import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface DocumentViewerProps {
  content: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ content }) => {
  const [expanded, setExpanded] = useState(false);

  // Limita a visualização prévia a 500 caracteres
  const previewContent =
    content.length > 500 ? `${content.substring(0, 500)}...` : content;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Conteúdo do Documento</span>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                Ver Completo
              </Button>
            </SheetTrigger>
            <SheetContent
              className="w-[90%] sm:w-[80%] md:w-[60%] overflow-y-auto"
              side="right"
            >
              <SheetHeader>
                <SheetTitle>Conteúdo Completo do Documento</SheetTitle>
              </SheetHeader>
              <div className="mt-6 whitespace-pre-wrap">{content}</div>
            </SheetContent>
          </Sheet>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 p-4 rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm">
            {expanded ? content : previewContent}
          </pre>
          {content.length > 500 && !expanded && (
            <Button
              variant="link"
              className="mt-2"
              onClick={() => setExpanded(true)}
            >
              Ver mais...
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentViewer;
