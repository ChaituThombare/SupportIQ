using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportIQ.Application.DTOs.Messages;
using SupportIQ.Application.Interfaces;
using SupportIQ.Domain.Entities;
using SupportIQ.Infrastructure.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace SupportIQ.API.Controllers
{
    [ApiController]
    [Route("api/tickets/{id:int}/messages")]
    [Authorize(Roles = "Customer,Agent,Admin")]
    public class TicketMessageController : ControllerBase
    {
        private readonly IMessageService _messageService;

        public TicketMessageController(IMessageService messageService)
        {
            _messageService = messageService;
        }
        
        private int? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            return int.TryParse(claim, out var userId) ? userId : null;
        }

        // MESSAGES
        [HttpGet]
        public async Task<IActionResult> GetConversation(int id)
        {
            var userId = GetCurrentUserId();

            if (userId is null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }

            var role = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrWhiteSpace(role))
            {
                return Forbid();
            }

            try
            {
                var messages = await _messageService.GetConversationAsync(id, userId.Value, role);

                return Ok(messages);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage(int id, [FromBody] SendMessageRequest request)
        {
            var userId = GetCurrentUserId();

            if (userId is null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }

            var role = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrWhiteSpace(role))
            {
                return Forbid();
            }

            try
            {
                var message = await _messageService.SendMessageAsync(id, userId.Value, role, request.MessageText);

                if (message is null)
                {
                    return NotFound(new
                    {
                        message = "Ticket not found."
                    });
                }

                return Ok(message);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }
    }
}
