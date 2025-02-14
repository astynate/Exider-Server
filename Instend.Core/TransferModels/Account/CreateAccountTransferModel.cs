﻿using System.ComponentModel.DataAnnotations;

namespace Instend.Core.TransferModels.Account
{
    public record UserTransferModel
    (
         [Required][MaxLength(45)] string name,
         [Required][MaxLength(45)] string surname,
         [Required][MaxLength(45)] string nickname,
         [Required][MaxLength(45)] string email,
         [Required][MaxLength(45)] string password,
         [Required] DateOnly dateOfBirth
    );
}