import pandas as pd
from io import BytesIO
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime

class ExportService:
    @staticmethod
    def export_sales_to_excel(data: dict, filename: str):
        try:
            output = BytesIO()
            
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                # Sales Summary
                summary_data = {
                    'Metric': ['Total Sales', 'Total Tax', 'Transactions', 'Avg Transaction Value'],
                    'Value': [
                        data['summary']['total_sales'],
                        data['summary']['total_tax'],
                        data['summary']['total_transactions'],
                        data['summary']['average_transaction_value']
                    ]
                }
                summary_df = pd.DataFrame(summary_data)
                summary_df.to_excel(writer, sheet_name='Summary', index=False)
                
                # Payment Methods
                payment_data = []
                for method, count in data['summary']['payment_methods'].items():
                    payment_data.append({'Payment Method': method, 'Count': count})
                payment_df = pd.DataFrame(payment_data)
                payment_df.to_excel(writer, sheet_name='Payment Methods', index=False)
                
                # Top Products
                products_df = pd.DataFrame(data['top_products'])
                products_df.to_excel(writer, sheet_name='Top Products', index=False)
                
                # Sales Trends
                trends_df = pd.DataFrame(data['sales_trends'])
                trends_df.to_excel(writer, sheet_name='Sales Trends', index=False)
                
                # Formatting
                workbook = writer.book
                money_format = workbook.add_format({'num_format': '$#,##0.00'})
                percent_format = workbook.add_format({'num_format': '0.00%'})
                
                for sheet_name in writer.sheets:
                    worksheet = writer.sheets[sheet_name]
                    if 'Value' in worksheet.get_name():
                        worksheet.set_column('B:B', 15, money_format)
                    if 'Margin' in worksheet.get_name():
                        worksheet.set_column('E:E', 15, percent_format)
            
            output.seek(0)
            
            return StreamingResponse(
                output,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename={filename}.xlsx"}
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Excel export failed: {str(e)}")

    @staticmethod
    def export_sales_to_csv(data: dict, filename: str):
        try:
            # Create CSV content
            csv_content = []
            
            # Summary section
            csv_content.append("SALES SUMMARY")
            csv_content.append(f"Total Sales,${data['summary']['total_sales']:,.2f}")
            csv_content.append(f"Total Tax,${data['summary']['total_tax']:,.2f}")
            csv_content.append(f"Transactions,{data['summary']['total_transactions']}")
            csv_content.append(f"Avg Transaction Value,${data['summary']['average_transaction_value']:,.2f}")
            csv_content.append("")
            
            # Payment methods
            csv_content.append("PAYMENT METHODS")
            for method, count in data['summary']['payment_methods'].items():
                csv_content.append(f"{method},{count}")
            csv_content.append("")
            
            # Top products
            csv_content.append("TOP PRODUCTS")
            csv_content.append("Product,Quantity Sold,Revenue,Margin")
            for product in data['top_products']:
                csv_content.append(f"{product['product_name']},{product['quantity_sold']},${product['total_revenue']:,.2f},{product['profit_margin']:.1f}%")
            csv_content.append("")
            
            # Sales trends
            csv_content.append("SALES TRENDS")
            csv_content.append("Date,Daily Sales,Transactions,Avg Order Value")
            for trend in data['sales_trends']:
                csv_content.append(f"{trend['date']},${trend['daily_sales']:,.2f},{trend['transactions']},${trend['average_order_value']:,.2f}")
            
            csv_output = "\n".join(csv_content)
            
            return StreamingResponse(
                iter([csv_output]),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"CSV export failed: {str(e)}")

    @staticmethod
    def export_inventory_to_excel(data: dict, filename: str):
        # Similar implementation for inventory reports
        pass

    @staticmethod
    def export_financial_to_excel(data: dict, filename: str):
        # Similar implementation for financial reports
        pass
