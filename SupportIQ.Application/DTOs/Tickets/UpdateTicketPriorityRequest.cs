using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace SupportIQ.Application.DTOs.Tickets
{
    public class UpdateTicketPriorityRequest
    {
        [Required]
        public string Priority { get; set; } = string.Empty;
    }
}
