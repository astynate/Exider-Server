﻿using Instend.Core;
using Instend.Repositories.Storage;
using Instend.Services.Internal.Handlers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instend_Version_2._0._0.Server.Controllers.Storage
{
    [ApiController]
    [Route("api/[controller]")]
    public class CloudController : ControllerBase
    {
        private readonly ICollectionsRepository _collectionsRepository;

        private readonly IAccessHandler _accessHandler;

        public CloudController(ICollectionsRepository folderRepository, IAccessHandler accessHandler)
        {
            _accessHandler = accessHandler;
            _collectionsRepository = folderRepository;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetPath(Guid? id)
        {
            var available = await _accessHandler
                .GetAccountAccessToCollection(id, Request, Configuration.EntityRoles.Reader);

            if (available.IsFailure)
                return Conflict(available.Error);

            var path = await _collectionsRepository
                .GetShortPathAsync(id);

            return Ok(path);
        }
    }
}