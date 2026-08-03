export type BannerVariant = "success" | "error" | "warning";

export type BannerState = {
    id: number;
    variant: BannerVariant;
    title?: string;
    message: string;
};