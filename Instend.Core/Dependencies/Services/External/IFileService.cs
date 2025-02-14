﻿using CSharpFunctionalExtensions;
using Microsoft.AspNetCore.Http;

namespace Instend.Services.External.FileService
{
    public interface IFileService
    {
        Task<Result<byte[]>> ReadFileAsync(string path);
        byte[] CreateZipFromFiles(Core.Models.Storage.File.File[] files);
        string ConvertSystemTypeToContentType(string? systemType);
        Task WriteFileAsync(string path, byte[] file);
        void DeleteFile(string path);
        Task SaveIFormFile(IFormFile file, string path);
        Task WriteFileAsync(string path, string? file);
    }
}