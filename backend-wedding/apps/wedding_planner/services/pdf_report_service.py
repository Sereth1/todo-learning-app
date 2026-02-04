"""
PDF Report Generation Service

Generates printable PDF reports for wedding planning:
- Guest list with meal selections
- Table seating arrangements
"""
import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT


class WeddingPDFReport:
    """Generate PDF reports for wedding planning."""
    
    def __init__(self, wedding):
        self.wedding = wedding
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles."""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#be123c'),  # Rose color
        ))
        self.styles.add(ParagraphStyle(
            name='SectionTitle',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceBefore=20,
            spaceAfter=10,
            textColor=colors.HexColor('#1f2937'),
        ))
        self.styles.add(ParagraphStyle(
            name='SubSection',
            parent=self.styles['Heading3'],
            fontSize=12,
            spaceBefore=15,
            spaceAfter=8,
            textColor=colors.HexColor('#4b5563'),
        ))
        self.styles.add(ParagraphStyle(
            name='Footer',
            parent=self.styles['Normal'],
            fontSize=8,
            alignment=TA_CENTER,
            textColor=colors.gray,
        ))
    
    def generate_full_report(self):
        """Generate a complete wedding report PDF."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5*cm,
            leftMargin=1.5*cm,
            topMargin=2*cm,
            bottomMargin=2*cm,
        )
        
        elements = []
        
        # Title
        elements.append(Paragraph(
            f"Wedding Report",
            self.styles['CustomTitle']
        ))
        elements.append(Paragraph(
            f"{self.wedding.display_name}",
            self.styles['Heading2']
        ))
        elements.append(Paragraph(
            f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
            self.styles['Normal']
        ))
        elements.append(Spacer(1, 30))
        
        # Guest Meal Selections Section
        elements.extend(self._build_meal_section())
        
        # Page break before seating
        elements.append(PageBreak())
        
        # Table Seating Section
        elements.extend(self._build_seating_section())
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    def _build_meal_section(self):
        """Build the meal selections section."""
        from apps.wedding_planner.models import Guest
        from apps.wedding_planner.models.meal_model import GuestMealSelection
        
        elements = []
        elements.append(Paragraph("Guest Meal Selections", self.styles['SectionTitle']))
        
        # Get all confirmed guests with their meal selections
        guests = Guest.objects.filter(
            wedding=self.wedding,
            attendance_status='yes'
        ).order_by('last_name', 'first_name')
        
        if not guests.exists():
            elements.append(Paragraph("No confirmed guests yet.", self.styles['Normal']))
            return elements
        
        # Build meal table data
        table_data = [['Guest Name', 'Meal Selection', 'Dietary Notes']]
        
        for guest in guests:
            name = f"{guest.first_name} {guest.last_name}"
            
            # Get meal selection
            try:
                meal_selection = guest.meal_selection
                meal_name = meal_selection.meal_choice.name if meal_selection.meal_choice else "Not selected"
            except GuestMealSelection.DoesNotExist:
                meal_name = "Not selected"
            
            dietary = guest.dietary_restrictions or "-"
            
            table_data.append([name, meal_name, dietary[:50]])  # Truncate long dietary notes
            
            # Add plus one if coming
            if guest.is_plus_one_coming and guest.plus_one_name:
                table_data.append([f"  + {guest.plus_one_name}", "Not selected", "-"])
        
        # Create table
        meal_table = Table(table_data, colWidths=[6*cm, 5*cm, 6*cm])
        meal_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#be123c')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 1), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ]))
        
        elements.append(meal_table)
        
        # Meal summary
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("Meal Summary by Type", self.styles['SubSection']))
        
        meal_counts = {}
        for guest in guests:
            try:
                meal_selection = guest.meal_selection
                if meal_selection.meal_choice:
                    meal_type = meal_selection.meal_choice.get_meal_type_display()
                    meal_counts[meal_type] = meal_counts.get(meal_type, 0) + 1
            except:
                meal_counts['Not selected'] = meal_counts.get('Not selected', 0) + 1
        
        if meal_counts:
            summary_data = [['Meal Type', 'Count']]
            for meal_type, count in sorted(meal_counts.items()):
                summary_data.append([meal_type, str(count)])
            summary_data.append(['Total', str(sum(meal_counts.values()))])
            
            summary_table = Table(summary_data, colWidths=[8*cm, 3*cm])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#6b7280')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (1, 0), (1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f3f4f6')),
            ]))
            elements.append(summary_table)
        
        return elements
    
    def _build_seating_section(self):
        """Build the table seating section."""
        from apps.wedding_planner.models import Table as WeddingTable
        from apps.wedding_planner.models.seating_model import SeatingAssignment
        
        elements = []
        elements.append(Paragraph("Table Seating Arrangements", self.styles['SectionTitle']))
        
        # Get all tables
        tables = WeddingTable.objects.filter(wedding=self.wedding).order_by('table_number')
        
        if not tables.exists():
            elements.append(Paragraph("No tables created yet.", self.styles['Normal']))
            return elements
        
        for table in tables:
            # Table header
            table_name = f"Table {table.table_number}"
            if table.name:
                table_name += f" - {table.name}"
            if table.is_vip:
                table_name += " (VIP)"
            
            elements.append(Paragraph(table_name, self.styles['SubSection']))
            
            # Table info
            location = f"Location: {table.location}" if table.location else ""
            capacity_info = f"Capacity: {table.seats_taken}/{table.capacity}"
            if location:
                elements.append(Paragraph(f"{location} | {capacity_info}", self.styles['Normal']))
            else:
                elements.append(Paragraph(capacity_info, self.styles['Normal']))
            
            elements.append(Spacer(1, 5))
            
            # Get seated guests
            assignments = SeatingAssignment.objects.filter(table=table).select_related('guest')
            
            if assignments.exists():
                guest_data = [['#', 'Guest Name', 'Type', 'Meal']]
                
                for i, assignment in enumerate(assignments, 1):
                    guest = assignment.guest
                    name = f"{guest.first_name} {guest.last_name}"
                    
                    # Attendee type
                    if assignment.attendee_type == 'guest':
                        att_type = "Guest"
                    elif assignment.attendee_type == 'plus_one':
                        att_type = "Plus One"
                    else:
                        att_type = "Child"
                    
                    # Meal
                    try:
                        meal = guest.meal_selection.meal_choice.name if guest.meal_selection.meal_choice else "-"
                    except:
                        meal = "-"
                    
                    guest_data.append([str(i), name, att_type, meal])
                
                guest_table = Table(guest_data, colWidths=[1*cm, 6*cm, 3*cm, 5*cm])
                guest_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 8),
                    ('ALIGN', (0, 0), (0, -1), 'CENTER'),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ]))
                elements.append(guest_table)
            else:
                elements.append(Paragraph("No guests assigned to this table.", self.styles['Normal']))
            
            elements.append(Spacer(1, 15))
        
        # Summary
        elements.append(Spacer(1, 10))
        elements.append(Paragraph("Seating Summary", self.styles['SubSection']))
        
        total_capacity = sum(t.capacity for t in tables)
        total_seated = sum(t.seats_taken for t in tables)
        
        summary_text = f"Total Tables: {tables.count()} | Total Capacity: {total_capacity} | Seated: {total_seated} | Available: {total_capacity - total_seated}"
        elements.append(Paragraph(summary_text, self.styles['Normal']))
        
        return elements


def generate_wedding_report_pdf(wedding):
    """Generate a complete wedding report PDF."""
    report = WeddingPDFReport(wedding)
    return report.generate_full_report()
