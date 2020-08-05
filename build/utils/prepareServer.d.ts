declare function prepareServer({ bootstrapComplete }: {
    bootstrapComplete: any;
}): (req: any, res: any, next: any) => Promise<any>;
export { prepareServer };
