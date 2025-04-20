export interface ApiResponse<T> {
    message?: string;
    data?: T;
    result?: boolean;
}
