import { useEffect } from 'react';

/**
 * Comportamento comum a gaveta e modal.
 *
 * Duas coisas que camadas sobrepostas quase sempre esquecem e que se notam na hora:
 *
 * A tecla Escape precisa fechar. Quem abriu um painel por engano espera sair sem procurar o
 * botao certo com o mouse.
 *
 * A pagina de tras nao pode rolar. Sem travar, girar a roda sobre a sobreposicao move o
 * conteudo escondido, e ao fechar o usuario se encontra em outro lugar da lista.
 */
export function useOverlay(isOpen: boolean, onDismiss: () => void): void {
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };

    // Guarda o valor anterior em vez de assumir que era vazio: outra camada pode ja ter
    // travado a rolagem, e restaurar para o padrao a destravaria cedo demais.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onDismiss]);
}
