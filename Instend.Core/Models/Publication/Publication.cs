﻿using CSharpFunctionalExtensions;
using Instend.Core.Models.Storage.File;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Instend.Core.Models.Public
{
    [Table("publications")]
    public class Publication
    {
        [Column("id")][Key] public Guid Id { get; private set; } = Guid.NewGuid();
        [Column("text")] public string Text { get; private set; } = string.Empty;
        [Column("date")] public DateTime Date { get; private set; } = DateTime.Now;
        [Column("number_of_reactions")] public uint NumberOfReactions { get; private set; } = 0;
        [Column("number_of_comments")] public uint NumberOfComments { get; private set; } = 0;
        [Column("number_of_views")] public uint NumberOfViews { get; private set; } = 0;
        [Column("owner_id")] public Guid OwnerId { get; private set; }

        [NotMapped] public bool IsLiked { get; set; } = false;

        public List<Attachment> Attechments { get; set; } = [];

        private Publication() { }

        public static Result<Publication> Create(string text, Guid ownerId)
        {
            if (string.IsNullOrEmpty(text) || string.IsNullOrWhiteSpace(text))
                return Result.Failure<Publication>("Invalid text");

            if (ownerId == Guid.Empty)
                return Result.Failure<Publication>("Invalid user id");

            return new Publication()
            {
                Text = text,
                OwnerId = ownerId
            };
        }

        public void SetAttachment(List<Attachment> attachment) => Attechments = attachment;
        public void IncrementLikes() => NumberOfReactions++;
        public void DecrementLikes() => NumberOfReactions--;
    }
}