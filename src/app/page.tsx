"use client";

import React, { useState, useCallback } from "react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DocumentViewer from "@/components/DocumentViwer";

const Index = () => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      setFileName(file.name);
      setIsProcessing(true);

      try {
        if (fileExtension === "pdf") {
          await handlePdfFile(file);
        } else if (fileExtension === "docx" || fileExtension === "doc") {
          await handleWordFile(file);
        } else {
          toast.error(
            "Formato de arquivo não suportado. Use PDF ou Word (doc/docx)."
          );
          setIsProcessing(false);
          return;
        }
      } catch (error) {
        console.error("Erro ao processar arquivo:", error);
        toast.error("Erro ao processar o arquivo. Tente novamente.");
        setIsProcessing(false);
      }
    },
    []
  );

  const handlePdfFile = async (file: File) => {
    try {
      // Importar pdfjs-dist dinamicamente
      const pdfjsLib = await import("pdfjs-dist");

      // Configurar worker usando JSDelivr CDN com versão específica
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.3.31/build/pdf.worker.min.mjs";

      console.log(
        "Worker configurado:",
        pdfjsLib.GlobalWorkerOptions.workerSrc
      );

      // Converter o arquivo para um ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      console.log("Iniciando processamento do PDF...");

      // Carregar o documento PDF
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      console.log(`PDF carregado com ${pdf.numPages} páginas`);

      let fullText = "";

      // Extrair texto de cada página
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`Processando página ${pageNum}...`);
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n";
        console.log(
          `Página ${pageNum} processada, texto extraído: ${pageText.length} caracteres`
        );
      }

      console.log("Conteúdo completo do PDF:", fullText);
      setFileContent(fullText);
      toast.success("PDF processado com sucesso!");
    } catch (error) {
      console.error("Erro ao analisar PDF:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWordFile = async (file: File) => {
    try {
      // Converter o arquivo para um ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Importar mammoth dinamicamente
      const mammoth = await import("mammoth");
      const result = await mammoth.default.extractRawText({
        arrayBuffer: arrayBuffer,
      });

      const content = result.value;
      console.log("Conteúdo do Word:", content);
      setFileContent(content);
      toast.success("Documento Word processado com sucesso!");
    } catch (error) {
      console.error("Erro ao analisar documento Word:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files[0];
    if (file) {
      const fileInput = document.getElementById(
        "fileInput"
      ) as HTMLInputElement;
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }, []);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const generateEditedPdf = async () => {
    if (!fileContent) return;

    try {
      // Importar jsPDF dinamicamente
      const { jsPDF } = await import("jspdf");

      // Criar novo documento PDF
      const pdf = new jsPDF();

      // Adicionar "EDITADO" no topo
      const editedContent = `EDITADO\n\n${fileContent}\n\nEDITADO`;

      // Configurar margens e largura da página
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;

      // Dividir o texto em linhas que cabem na página
      const lines = pdf.splitTextToSize(editedContent, maxWidth);

      // Adicionar texto ao PDF com quebra de página automática
      let yPosition = margin;
      const lineHeight = 7;
      const pageHeight = pdf.internal.pageSize.getHeight();

      lines.forEach((line: string) => {
        if (yPosition + lineHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      });

      // Gerar nome do arquivo
      const originalName = fileName
        ? fileName.replace(/\.[^/.]+$/, "")
        : "documento";
      const editedFileName = `${originalName}_editado.pdf`;

      // Fazer download do PDF
      pdf.save(editedFileName);

      toast.success("PDF editado gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar o PDF editado. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Leitor de Documentos
        </h1>

        <div className="grid grid-cols-1 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Documento</CardTitle>
              <CardDescription>
                Faça upload de documentos Word ou PDF para extrair o texto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-dashed border-2 border-primary/50 rounded-lg p-8 text-center hover:bg-accent/50 transition-colors cursor-pointer"
                onDrop={onDrop}
                onDragOver={onDragOver}
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                <input
                  id="fileInput"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {isProcessing ? (
                  <div>
                    <p className="text-lg font-medium mb-2">
                      Processando arquivo...
                    </p>
                    <div className="animate-pulse">Aguarde um momento...</div>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium mb-2">
                      Arraste e solte seu documento aqui, ou clique para
                      selecionar
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Formatos suportados: PDF, DOC, DOCX
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                {fileName
                  ? `Arquivo: ${fileName}`
                  : "Nenhum arquivo selecionado"}
              </p>
            </CardFooter>
          </Card>

          {fileContent && (
            <>
              <DocumentViewer content={fileContent} />
              <Card>
                <CardHeader>
                  <CardTitle>Gerar PDF Editado</CardTitle>
                  <CardDescription>
                    Clique no botão abaixo para gerar um novo PDF com a palavra
                    "EDITADO" no início e fim do texto.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={generateEditedPdf} className="w-full">
                    Baixar PDF Editado
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
