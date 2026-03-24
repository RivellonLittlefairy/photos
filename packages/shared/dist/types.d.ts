export type TimelineGranularity = "year" | "month" | "week";
export type PhotoPrivacy = "private" | "family";
export interface Photo {
    id: string;
    title: string;
    description?: string;
    url: string;
    capturedAt: string;
    stage?: string;
    tags: string[];
    privacy: PhotoPrivacy;
    createdAt: string;
    updatedAt: string;
}
export interface CreatePhotoInput {
    title: string;
    description?: string;
    url: string;
    capturedAt?: string;
    stage?: string;
    tags?: string[];
    privacy?: PhotoPrivacy;
}
export interface PhotoListQuery {
    stage?: string;
    tag?: string;
    from?: string;
    to?: string;
    keyword?: string;
}
export interface TimelineQuery {
    granularity?: TimelineGranularity;
}
export interface TimelineGroup {
    key: string;
    label: string;
    startAt: string;
    endAt: string;
    count: number;
    photos: Photo[];
}
export interface ApiResponse<T> {
    success: boolean;
    data: T;
}
