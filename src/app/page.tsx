"use client";

import React, { useState, useCallback, useEffect } from "react";
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
import DocumentViewer from "@/components/document-viewer";
import DisclaimmerModal from "@/components/disclaimmer-modal";
import { event } from "@/services/gtag";

const Index = () => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [chatResponse, setChatResponse] = useState<string | null>(null);

  const getOptimizedContentFromAI = async (
    content: string
  ): Promise<string> => {
    try {
      const aiPrompt = `Por favor, otimize o seguinte currículo para ser aprovado por sistemas ATS. Remova informações desnecessárias,remova imagens, use palavras-chave relevantes para vagas comuns e estruture de forma clara. Não insira nada alem da informação pessoal, não diga o que voce fez, não insira caracteres como "*",apenas mande o curriculo. Mantenha o formato de texto simples. Aqui está o currículo: \n\n${content}`;

      const response = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ promptText: aiPrompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Erro HTTP! Status: ${response.status}`
        );
      }

      const data = await response.json();
      return data.content;
    } catch (err: any) {
      console.error("Erro ao otimizar currículo via API:", err);
      throw new Error("Erro ao otimizar o currículo pela IA. Tente novamente.");
    }
  };

  const generatePdfFromContent = async (
    content: string,
    originalFileName: string | null
  ) => {
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF();

      const contentToPrint = `${content}`;

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;

      const lines = pdf.splitTextToSize(contentToPrint, maxWidth);

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

      const baseName = originalFileName
        ? originalFileName.replace(/\.[^/.]+$/, "")
        : "curriculo";
      const optimizedFileName = `${baseName}_otimizado_IA.pdf`;

      pdf.save(optimizedFileName);
      toast.success("PDF otimizado gerado e baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF otimizado:", error);
      throw new Error("Erro ao gerar o PDF otimizado. Tente novamente.");
    }
  };

  const handleOptimizeAndDownload = async () => {
    if (!fileContent) {
      toast.error("Por favor, faça upload de um currículo primeiro.");
      return;
    }

    event({
      action: "clicks",
      category: "engagement",
      label: "Clique no botão de Otimizar e Baixar",
    });

    setIsProcessing(true);
    setChatResponse(null);

    try {
      const optimizedText = await getOptimizedContentFromAI(fileContent);
      setChatResponse(optimizedText); // Armazenar para visualização se desejar

      await generatePdfFromContent(optimizedText, fileName);
    } catch (error: any) {
      console.error("Erro no processo de otimização e download:", error);
      toast.error(
        error.message || "Ocorreu um erro no processo. Tente novamente."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      setFileName(file.name);
      setIsProcessing(true);
      setFileContent(null);
      setChatResponse(null);

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
        setIsModalOpen(true);
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
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.3.31/build/pdf.worker.min.mjs"; //

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n";
      }
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
      const arrayBuffer = await file.arrayBuffer();
      const mammoth = await import("mammoth");
      const result = await mammoth.default.extractRawText({
        arrayBuffer: arrayBuffer,
      });
      const content = result.value;
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

  return (
    <div
      className={`min-h-[90vh] p-6 flex flex-col items-center justify-center`}
    >
      <DisclaimmerModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col justify-center items-center mb-8">
          <h1 className="text-3xl font-bold text-center ">
            Otimizador de Currículo com IA
          </h1>

          <p>
            Otimize seu currículo para ser aprovado pelos sistemas de
            recrutamento com inteligência artificial (ATS).
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Card de Upload de Documento */}
          <Card>
            <CardHeader>
              <CardTitle>Passo 1: Upload de Documento</CardTitle>
              <CardDescription>
                Faça upload do seu currículo no formato Word ou PDF.
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
                {isProcessing && !chatResponse ? ( // isProcessing para o upload/leitura local
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

          {/* Visualizador do Conteúdo Original (se houver e não houver resposta da IA ainda) */}
          {fileContent && !chatResponse && (
            <DocumentViewer content={fileContent} />
          )}

          {/* Card para Otimizar Currículo (aparece após o upload e antes da resposta da IA) */}
          {fileContent && !chatResponse && (
            <Card>
              <CardHeader>
                <CardTitle>Passo 2: Otimizar e Baixar</CardTitle>
                <CardDescription>
                  Clique para otimizar seu currículo com IA e baixar o PDF
                  automaticamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleOptimizeAndDownload}
                  disabled={isProcessing}
                  className="w-full cursor-pointer"
                >
                  {isProcessing
                    ? "Otimizando e Gerando PDF..."
                    : "Otimizar Currículo com IA"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Visualizador do Conteúdo Otimizado pela IA (se houver chatResponse) */}
          {chatResponse && (
            <Card>
              <CardHeader>
                <CardTitle>Passo 3: Currículo Otimizado pela IA</CardTitle>
                <CardDescription>
                  Este é o conteúdo do seu currículo otimizado. O download foi
                  iniciado automaticamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentViewer content={chatResponse} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
