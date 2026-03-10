import { create } from 'zustand';

interface FlashState {
    /** Se o viewer fullscreen está aberto */
    viewerOpen: boolean;
    /** ID do usuário cujos flashes estão sendo visualizados */
    viewingUserId: string | null;
    /** Índice do flash atual dentro do grupo do usuário */
    activeFlashIndex: number;

    openViewer: (userId: string, index?: number) => void;
    closeViewer: () => void;
    setActiveIndex: (index: number) => void;
}

export const useFlashStore = create<FlashState>((set) => ({
    viewerOpen: false,
    viewingUserId: null,
    activeFlashIndex: 0,

    openViewer: (userId, index = 0) =>
        set({ viewerOpen: true, viewingUserId: userId, activeFlashIndex: index }),

    closeViewer: () =>
        set({ viewerOpen: false, viewingUserId: null, activeFlashIndex: 0 }),

    setActiveIndex: (index) => set({ activeFlashIndex: index }),
}));
