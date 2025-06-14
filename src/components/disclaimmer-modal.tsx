import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface DisclaimerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DisclaimmerModal({
  open,
  onOpenChange,
}: DisclaimerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold">Disclaimer</DialogTitle>
          <DialogDescription>
            Seu currículo pode levar alguns segundos para ser gerado, enquanto
            isso aqui está algumas informações que você precisa saber.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Não garantimos que o currículo seja 100% aprovado
            </h2>
            <p>
              Usamos IA vs IA + parametrização + dados de mercado para gerar o
              seu currículo de uma forma que aumente a possibilidade de ser
              aprovado
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">
              Seus dados são processados de forma segura
            </h2>
            <p>
              Todas as informações fornecidas são tratadas com confidencialidade
              e utilizadas apenas para a geração do seu currículo profissional
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">Projeto Freelancer</h2>
            <p>
              Este serviço é totalmente gratuito e mantido por apenas um
              desenvolvedor que não recebe nenhum tipo de pagamento.{" "}
              <span className="text-gray-400">(mas aceito pix)</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
