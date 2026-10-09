using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SupportIQ.Application.DTOs.Tickets
{
    public class UpdateTicketPriorityRequest
    {
        public string Priority { get; set; } = string.Empty;
    }
}
