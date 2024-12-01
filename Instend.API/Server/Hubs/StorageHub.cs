﻿using Instend.Core.Models.Storage.Collection;
using Instend.Repositories.Storage;
using Instend.Services.Internal.Handlers;
using Microsoft.AspNetCore.SignalR;

namespace Instend_Version_2._0._0.Server.Hubs
{
    public class StorageHub : Hub
    {
        private readonly IFolderRepository _folderRepository;

        private readonly IRequestHandler _requestHandler;

        public StorageHub(IFolderRepository folderRepository, IRequestHandler requestHandler)
        {
            _folderRepository = folderRepository;
            _requestHandler = requestHandler;
        }

        public async Task Join(string authorization)
        {
            var userId = _requestHandler.GetUserId(authorization);

            if (userId.IsFailure) return;

            Collection[] folders = await _folderRepository
                .GetFoldersByUserId(Guid.Parse(userId.Value));

            Array.ForEach(folders, async x => await Groups
                .AddToGroupAsync(Context.ConnectionId, x.Id.ToString()));

            await Groups.AddToGroupAsync(Context.ConnectionId, userId.Value);
        }

        public async Task CreateFolder(Collection folder)
            => await Clients.Group(folder.Id.ToString()).SendAsync("CreateFolder", folder);
    }
}