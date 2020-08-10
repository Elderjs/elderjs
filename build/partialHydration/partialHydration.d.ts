declare const partialHydration: {
    markup: ({ content }: {
        content: any;
    }) => Promise<{
        code: any;
    }>;
};
export default partialHydration;
