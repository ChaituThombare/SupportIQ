using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SupportIQ.Infrastructure.Data;
using SupportIQ.Application.DTOs.Admin;
using SupportIQ.Domain.Entities;

namespace SupportIQ.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly SupportIQDbContext _context;

        public AdminController(SupportIQDbContext context)
        {
            _context = context;
        }

        [HttpGet("agents")]
        public async Task<IActionResult> GetAgents(CancellationToken cancellationToken)
        {
            var agents = await _context.Users
                .AsNoTracking()
                .Where(u => u.Role.RoleName == "Agent")
                .OrderBy(u => u.Name)
                .Select(u => new AdminAgentResponse
                {
                    Id = u.UserId,
                    Name = u.Name,
                    Email = u.Email,
                    Role = "Support Agent",
                    Availability = u.Availability,

                    ActiveTickets = _context.Tickets.Count(t => t.AssignedAgentId == u.UserId &&
                      t.Status != "Resolved" &&
                      t.Status != "Closed"),

                    ResolvedTickets = _context.Tickets.Count(t => t.AssignedAgentId == u.UserId &&
                      (t.Status == "Resolved" ||
                      t.Status == "Closed")),

                    TotalAssignedTickets = _context.Tickets.Count(t => t.AssignedAgentId == u.UserId),

                    IsActive = u.IsActive
                })
                .ToListAsync(cancellationToken);

            return Ok(agents);
        }

        [HttpPut("agents/{id:int}/availability")]
        public async Task<IActionResult> UpdateAgentAvailability(int id, [FromBody] UpdateAgentAvailabilityRequest request, CancellationToken cancellationToken)
        {
            var allowedValues = new[] { "Available", "Busy", "Away" };

            if(request is null || !allowedValues.Contains(request.Availability))
            {
                return BadRequest(new
                {
                    message = "Availability must be one of the following values: Available, Busy, Away."
                });
            }

            var agent = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == id && u.IsActive && u.Role.RoleName == "Agent", cancellationToken);

            if(agent is null)
            {
                return NotFound(new
                {
                    message = "Active support agent not found."
                });
            }

            agent.Availability = request.Availability;

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                id = agent.UserId,
                availability = agent.Availability,
                message = "Agent availability updated successfully.",
            });
        }

        [HttpPost("agents")]
        public async Task<IActionResult> CreateAgent(
            [FromBody] CreateAgentRequest request,
            CancellationToken cancellationToken)
        {
            var name = request.Name.Trim();
            var email = request.Email.Trim().ToLowerInvariant();

            if(name.Length < 2)
            {
                return BadRequest(new
                {
                    message = "Agent name must be at least 2 characters long."
                });
            }
            
            var emailExists = await _context.Users
                .AnyAsync(u => u.Email == email, cancellationToken);

            if (emailExists)
            {
                return Conflict(new
                {
                    message = "A account with the provided email already exists."
                });
            }

            var agentRole = await _context.Roles
                .SingleOrDefaultAsync(r => r.RoleName == "Agent", cancellationToken);
            
            if (agentRole is null)
            {
                return StatusCode(500, new
                {
                    message = "Agent role not found in the system."
                });
            }

            var agent= new User
            {
                Name = name,
                Email = email,
                RoleId = agentRole.RoleId,
                IsActive = true,
                Availability = "Available",
                CreatedOn = DateTime.Now
            };

            agent.PasswordHash = new PasswordHasher<User>().HashPassword(agent, request.Password);

            _context.Users.Add(agent);

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException)
            {
                var duplicatedEmail = await _context.Users
                    .AsNoTracking()
                    .AnyAsync(u => u.Email == email, cancellationToken);
                if (duplicatedEmail)
                {
                    return Conflict(new
                    {
                        message = "An account with this email already exists. Please use a different email."
                    });
                }
                throw;
            }
            return Ok(new AdminAgentResponse
            {
                Id = agent.UserId,
                Name = agent.Name,
                Email = agent.Email,
                Role = "Support Agent",
                Availability = agent.Availability,
                IsActive = agent.IsActive,
                ActiveTickets = 0,
                ResolvedTickets = 0,
                TotalAssignedTickets = 0
            });
        }

        // PUT: api/Admin/agents/{id}/active
        [HttpPut("agents/{id:int}/active")]
        public async Task<IActionResult> UpdateAgentActiveStatus(
            int id,
            [FromBody] UpdateAgentActiveStatusRequest request,
            CancellationToken cancellationToken)
        {
            if (request.IsActive is null)
            {
                return BadRequest(new
                {
                    message = "IsActive is required."
                });
            }

            var agent = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(
                    u => u.UserId == id && u.Role.RoleName == "Agent",
                    cancellationToken);

            if (agent is null)
            {
                return NotFound(new
                {
                    message = "Agent account not found."
                });
            }

            var activate = request.IsActive.Value;

            if (agent.IsActive == activate)
            {
                return Ok(new
                {
                    id = agent.UserId,
                    isActive = agent.IsActive,
                    message = activate
                        ? "Agent account is already active."
                        : "Agent account is already inactive."
                });
            }

            if (!activate)
            {
                var activeTickets = await _context.Tickets
                    .CountAsync(
                        t => t.AssignedAgentId == id &&
                             t.Status != "Resolved" &&
                             t.Status != "Closed",
                        cancellationToken);

                if (activeTickets > 0)
                {
                    return Conflict(new
                    {
                        message =
                            $"Reassign or resolve the agent's {activeTickets} active ticket(s) before deactivating this account."
                    });
                }
            }

            agent.IsActive = activate;

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                id = agent.UserId,
                isActive = agent.IsActive,
                message = activate
                    ? "Agent account activated successfully."
                    : "Agent account deactivated successfully."
            });
        }
    }
}
