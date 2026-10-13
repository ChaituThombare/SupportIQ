using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportIQ.Application.DTOs.Tickets;
using SupportIQ.Application.Interfaces;

namespace SupportIQ.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketController : ControllerBase
    {
        private readonly ITicketService _ticketService;

        public TicketController(ITicketService ticketService)
        {
            _ticketService = ticketService;
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

            if (customerId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }

            try
            {
                var ticket = await _ticketService.CreateTicketAsync(request, customerId.Value);

                return CreatedAtAction(nameof(GetTicketById), new { id = ticket.TicketId },
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

            if (customerId is null)
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

            if (customerId is null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }

            var ticket = await _ticketService.GetTicketByIdAsync(id, customerId.Value);

            if (ticket is null)
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

            if (agentId is null)
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
        public async Task<IActionResult> AssignTicket(int id, [FromBody] AssignTicketRequest request)
        {
            try
            {
                var ticket = await _ticketService.AssignTicketAsync(id, request.AgentId);

                if (ticket is null)
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
        public async Task<IActionResult> UpdateTicketStatus(int id, [FromBody] UpdateTicketStatusRequest request)
        {
            var userId = GetCurrentUserId();

            if (userId is null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }

            try
            {
                var ticket = await _ticketService.UpdateTicketStatusAsync(id, request.Status, userId.Value, User.IsInRole("Admin"));

                if (ticket is null)
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
                return StatusCode(StatusCodes.Status403Forbidden, new
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

        [Authorize(Roles = "Agent,Admin")]
        [HttpPut("{id:int}/priority")]
        public async Task<IActionResult> UpdateTicketPriority(int id, [FromBody] UpdateTicketPriorityRequest request)
        {
            var userId = GetCurrentUserId();

            if (userId is null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user identity."
                });
            }

            try
            {
                var ticket = await _ticketService.UpdateTicketPriorityAsync(id, request.Priority, userId.Value, User.IsInRole("Admin"));

                if (ticket is null)
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
                return StatusCode(StatusCodes.Status403Forbidden, new
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
    }
}