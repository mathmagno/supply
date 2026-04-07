import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import api from "@/lib/api";

interface ResultadoImportacao {
  sessao_id: number;
  data_cotacao: string;
  especificacoes_criadas: number;
  especificacoes_atualizadas: number;
  cotacoes_inseridas: number;
  avisos: string[];
}

export default function ImportacaoPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setArquivo(f);
      setResultado(null);
      setErro(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) {
      setArquivo(f);
      setResultado(null);
      setErro(null);
    }
  }

  async function importar() {
    if (!arquivo) return;
    setEnviando(true);
    setErro(null);
    try {
      const form = new FormData();
      form.append("arquivo", arquivo);
      form.append("categoria_padrao", "Geral");
      const { data } = await api.post<ResultadoImportacao>("/etl/importar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResultado(data);
      setArquivo(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setErro(msg ?? "Erro ao importar planilha.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Importar Planilha</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload do arquivo .xlsx
          </CardTitle>
          <CardDescription>
            A planilha deve ter as colunas: <strong>Data, produto, marca, especificacao,
            Custo planejado, Último custo, fornecedor 1 … fornecedor 6</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-10 cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            {arquivo ? (
              <p className="text-sm font-medium">{arquivo.name}</p>
            ) : (
              <>
                <p className="text-sm font-medium">Arraste o arquivo ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-1">.xlsx ou .xls</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleArquivo}
              className="hidden"
            />
          </div>

          {arquivo && (
            <Button onClick={importar} disabled={enviando} className="w-full">
              {enviando ? "Importando..." : "Importar Planilha"}
            </Button>
          )}

          {erro && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {erro}
            </div>
          )}
        </CardContent>
      </Card>

      {resultado && (
        <Card className="border-green-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Importação concluída
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-2xl font-bold">{resultado.especificacoes_criadas}</p>
                <p className="text-xs text-muted-foreground">Produtos criados</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-2xl font-bold">{resultado.especificacoes_atualizadas}</p>
                <p className="text-xs text-muted-foreground">Produtos atualizados</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center col-span-2">
                <p className="text-2xl font-bold">{resultado.cotacoes_inseridas}</p>
                <p className="text-xs text-muted-foreground">Preços de cotação inseridos</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Sessão #{resultado.sessao_id} · Data: {resultado.data_cotacao}
            </p>
            {resultado.avisos.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-yellow-600">Avisos:</p>
                {resultado.avisos.map((a, i) => (
                  <Badge key={i} variant="warning" className="text-xs block w-fit">
                    {a}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
