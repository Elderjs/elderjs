declare const partialHydration: {
    markup: ({ content, filename }: {
        content: any;
        filename: any;
    }) => Promise<{
        code: any;
    }>;
};
export default partialHydration;
