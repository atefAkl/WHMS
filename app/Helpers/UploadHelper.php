<?php

namespace App\Helpers;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadHelper
{
    /**
     * Upload a file to the specified directory.
     *
     * @param UploadedFile $file
     * @param string $directory
     * @param string $disk
     * @return array{path: string, name: string, size: string}
     */
    public static function upload(UploadedFile $file, string $directory = 'uploads', string $disk = 'public'): array
    {
        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $filename = time() . '_' . Str::random(10) . '.' . $extension;

        // Store file and get path
        $path = $file->storeAs($directory, $filename, $disk);
        $url = Storage::disk($disk)->url($path);

        // Get size string
        $bytes = $file->getSize();
        $size = self::formatBytes($bytes);

        return [
            'path' => $url,
            'name' => $originalName,
            'size' => $size,
        ];
    }

    /**
     * Delete a file by its URL or relative path.
     *
     * @param string $path
     * @param string $disk
     * @return bool
     */
    public static function delete(string $path, string $disk = 'public'): bool
    {
        // Extract relative path from URL if needed
        $storagePrefix = '/storage/';
        if (str_starts_with($path, $storagePrefix)) {
            $relativePath = substr($path, strlen($storagePrefix));
        } else {
            $relativePath = $path;
        }

        if (Storage::disk($disk)->exists($relativePath)) {
            return Storage::disk($disk)->delete($relativePath);
        }

        return false;
    }

    /**
     * Format bytes to human readable format.
     */
    private static function formatBytes(int $bytes, int $precision = 1): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
