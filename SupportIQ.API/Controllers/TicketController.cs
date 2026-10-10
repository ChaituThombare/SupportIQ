using System.Formats.Asn1;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportIQ.Application.DTOs.Tickets;
using SupportIQ.Application.DTOs.Messages;
using SupportIQ.Application.Interfaces;

namespace SupportIQ.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketController : ControllerBase
    {
        private readonly ITicketService _ticketService;
        private readonly IMessageService _messageService;
        private readonly IAITicketService _aITicketService;

        public TicketController(ITicketService ticketService, IMessageService messageService, IAITicketService aITicketService)
        {
            _ticketService = ticketService;
            _messageService = messageService;
            _aITicketService = aITicketService;
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            return int.TryParse(userIdClaim, out var UserId) ? UserId : null;
        }

        // CUSTOMER
        [Authorize(Roles = "Customer")]
        [HttpPost]
        public async Task<IActionResult> CreateTicket(CreateTicketRequest request)
        {
            var customerId = GetCurrentUserId();
            
            if(customerId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }

            try
            {
                var ticket = await _ticketService.CreateTicketAsync(request, customerId.Value);

                return CreatedAtAction(nameof(CreateTicket), new { id = ticket.TicketId },
                    ticket);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [Authorize(Roles = "Customer")]
        [HttpGet("my")]
        public async Task<IActionResult> GetMyTickets()
        {
            var customerId = GetCurrentUserId();

            if(customerId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }

            var tickets = await _ticketService.GetMyTicketAsync(customerId.Value);

            return Ok(tickets);
        }

        [Authorize(Roles = "Customer")]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetTicketById(int id)
        {
            var customerId = GetCurrentUserId();

            if (customerId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }

            var ticket = await _ticketService.GetTicketByIdAsync(id, customerId.Value);

            if (ticket == null)
            {
                return NotFound(new
                {
                    message = "Ticket not found."
                });
            }
            return Ok(ticket);
        }

        // AGENT
        [Authorize(Roles = "Agent")]
        [HttpGet("queue")]
        public async Task<IActionResult> GetAgentQueue()
        {
            var tickets = await _ticketService.GetAgentQueueAsync();

            return Ok(tickets);
        }

        [Authorize(Roles = "Agent")]
        [HttpGet("assigned")]
        public async Task<IActionResult> GetAssignedTickets()
        {
            var agentId = GetCurrentUserId();

            if(agentId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }

            var tickets = await _ticketService.GetAssignedTicketAsync(agentId.Value);

            return Ok(tickets);
        }

        // ADMIN
        [Authorize(Roles = "Admin")]
        [HttpPost("{id:int}/assign")]
        public async Task<IActionResult> AssignTicket(int id, AssignTicketRequest request)
        {
            try
            {
                var ticket = await _ticketService.AssignTicketAsync(id, request.AgentId);

                if (ticket == null)
                {
                    return NotFound(new
                    {
                        message = "Ticket not found."
                    });
                }
                return Ok(ticket);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // AGENT / ADMIN
        [Authorize(Roles = "Agent,Admin")]
        [HttpPut("{id:int}/status")]
        public async Task<IActionResult> UpdateTicketStatus(int id, UpdateTicketStatusRequest request)
        {
            var userId = GetCurrentUserId();

            if(userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }

            try
            {
                var ticket = await _ticketService.UpdateTicketStatusAsync(id, request.Status, userId.Value, User.IsInRole("Admin"));

                if(ticket == null)
                {
                    return NotFound(new
                    {
                        message = "Ticket not found."
                    });
                }

                return Ok(ticket);
            }
            catch(UnauthorizedAccessException ex)
            {
                return StatusCode(403, new
                {   
                    message = ex.Message
                });
            }
            catch(ArgumentException ex)
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

        [Authorize(Roles = "Agent,Admin")]
        [HttpPut("{id:int}/priority")]
        public async Task<IActionResult> UpdateTicketPriority(int id, UpdateTicketPriorityRequest request)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }

            try
            {
                var ticket = await _ticketService.UpdateTicketPriorityAsync(id, request.Priority, userId.Value, User.IsInRole("Admin"));

                if (ticket == null)
                {
                    return NotFound(new
                    {
                        message = "Ticket not found."
                    });
                }

                return Ok(ticket);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new
                {
                    message = ex.Message
                });
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

        // MESSAGES
        [Authorize(Roles = "Customer,Agent,Admin")]
        [HttpGet("{id:int}/messages")]
        public async Task<IActionResult> GetConversation(int id)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }

            var role = User.FindFirstValue(ClaimTypes.Role);

            if(string.IsNullOrWhiteSpace(role))
            {
                return Forbid();
            }
            try
            {
                var messages = await _messageService.GetConversationAsync(id, userId.Value, role);

                return Ok(messages);
            }
            catch(UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize(Roles = "Customer,Agent,Admin")]
        [HttpPost("{id:int}/messages")]
        public async Task<IActionResult?> SendMessage(int id, SendMessageRequest request)
        {
            var userId = GetCurrentUserId();

            if(userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }

            var role = User.FindFirstValue(ClaimTypes.Role);

            if(string.IsNullOrWhiteSpace(role))
            {
                return Forbid();
            }

            try
            {
                var message = await _messageService.SendMessageAsync(id, userId.Value, role, request.MessageText);

                if(message == null)
                {
                    return NotFound(new
                    {
                        message = "Ticket not found."
                    });
                }

                return Ok(message);
            }
            catch(UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch(ArgumentException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
            catch(InvalidOperationException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // AGENT / ADMIN
        [Authorize(Roles = "Agent,Admin")]
        [HttpPost("{id:int}/ai-analysis")]
        public async Task<IActionResult> AnalyzeTicket(int id, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _aITicketService.AnalyzeTicketAsync(id, cancellationToken);

                if(result == null)
                {
                    return NotFound(new
                    {
                        message = "Ticket not found."
                    });
                }

                return Ok(result);
            }
            catch (HttpRequestException)
            {
                return StatusCode(503, new
                {
                    message = "AI service is cuurrently unavailable. The ticket remains saved."
                });
            }
            catch (OperationCanceledException)
            {
                return StatusCode(503, new
                {
                    message = "AI analysis was cancelled or timed out. The ticket remains saved."
                });
            }
            catch(InvalidOperationException ex)
            {
                return StatusCode(503, new
                {
                    message = ex.Message
                });
            }
        }
    }
}
