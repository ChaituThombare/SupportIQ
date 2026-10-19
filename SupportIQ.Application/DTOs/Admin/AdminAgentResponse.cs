using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SupportIQ.Application.DTOs.Admin
{
    public class AdminAgentResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Availability { get; set; } = string.Empty;
        public int ActiveTickets { get; set; }
        public int ResolvedTickets { get; set; }
        public int TotalAssignedTickets { get; set; }
        public bool IsActive { get; set; }
    }
}
