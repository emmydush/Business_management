import csv
import random

# Sample product names organized by category
product_names_by_category = {
    "Electronics": [
        "Smartphone", "Laptop", "Tablet", "Headphones", "Speaker", 
        "TV", "Camera", "Gaming Console", "Smart Watch", "Bluetooth Earbuds",
        "Wireless Charger", "Power Bank", "Router", "Monitor", "Keyboard",
        "Mouse", "Webcam", "Microphone", "Projector", "Printer"
    ],
    "Clothing": [
        "T-Shirt", "Jeans", "Dress", "Shirt", "Jacket",
        "Sweater", "Shorts", "Skirt", "Blouse", "Coat",
        "Socks", "Underwear", "Hat", "Scarf", "Gloves",
        "Belt", "Sneakers", "Boots", "Sandals", "Formal Shoes"
    ],
    "Home & Kitchen": [
        "Blender", "Microwave", "Refrigerator", "Coffee Maker", "Toaster",
        "Cookware Set", "Cutlery Set", "Pots and Pans", "Mixing Bowls", "Cutting Board",
        "Dishwasher", "Oven", "Stove", "Kitchen Utensils", "Food Processor",
        "Rice Cooker", "Slow Cooker", "Pressure Cooker", "Electric Kettle", "Waffle Maker"
    ],
    "Beauty & Personal Care": [
        "Moisturizer", "Shampoo", "Conditioner", "Soap", "Perfume",
        "Deodorant", "Sunscreen", "Face Wash", "Body Lotion", "Hair Gel",
        "Lipstick", "Eyeshadow Palette", "Mascara", "Foundation", "Concealer",
        "Primer", "Setting Powder", "Eye Liner", "Makeup Remover", "Nail Polish"
    ],
    "Sports & Outdoors": [
        "Yoga Mat", "Dumbbell", "Exercise Bike", "Treadmill", "Resistance Bands",
        "Basketball", "Soccer Ball", "Tennis Racket", "Golf Clubs", "Swimming Goggles",
        "Camping Tent", "Sleeping Bag", "Backpack", "Hiking Boots", "Water Bottle",
        "Cycling Helmet", "Bicycle", "Skates", "Surfboard", "Kayak"
    ],
    "Books & Stationery": [
        "Novel", "Textbook", "Notebook", "Pen", "Pencil",
        "Marker", "Highlighter", "Eraser", "Ruler", "Calculator",
        "Desk Lamp", "Bookshelf", "Binder", "Folder", "Stapler",
        "Paper Clips", "Glue Stick", "Scissors", "Pencil Case", "Diary"
    ],
    "Automotive": [
        "Car Battery", "Tire", "Brake Pad", "Oil Filter", "Air Filter",
        "Spark Plug", "Windshield Wiper", "Car Wax", "Floor Mat", "Seat Cover",
        "Dashboard Camera", "Car Charger", "Jack", "Tow Strap", "Jump Starter",
        "Car Vacuum", "Tire Pressure Gauge", "Multimeter", "Socket Set", "Screwdriver Set"
    ],
    "Toys & Games": [
        "Board Game", "Puzzle", "Action Figure", "Doll", "Building Blocks",
        "Remote Control Car", "Drone", "Play-Doh", "Art Set", "Musical Instrument",
        "Video Game", "Game Controller", "Toy Train", "Teddy Bear", "Ball Pit",
        "Trampoline", "Swing Set", "Slide", "Sandbox", "Toy Kitchen"
    ]
}

# Generate 100 products
products = []

for _ in range(100):
    # Randomly select a category
    category = random.choice(list(product_names_by_category.keys()))
    
    # Randomly select a product name from that category
    product_name = random.choice(product_names_by_category[category])
    
    # Generate a unique product ID
    product_id = f"PROD-{random.randint(1000, 9999)}"
    
    # Generate cost price (lower than selling price)
    cost_price = round(random.uniform(500, 18000), 2)
    
    # Selling price should be higher than cost price
    selling_price = round(cost_price * random.uniform(1.1, 1.5), 2)
    
    # Quantity in the range 1000 to 20000
    quantity = random.randint(1000, 20000)
    
    # Create product dictionary
    product = {
        "product_id": product_id,
        "name": f"{product_name} {random.choice(['Pro', 'Max', 'Ultra', 'Mini', 'Lite', 'Plus', 'Deluxe'])}",
        "category": category,
        "cost_price": cost_price,
        "selling_price": selling_price,
        "quantity": quantity,
        "reorder_level": random.randint(100, 500),
        "description": f"High quality {product_name} for your needs",
        "barcode": f"BC{random.randint(100000000000, 999999999999)}"  # 12-13 digit barcode
    }
    
    products.append(product)

# Write to CSV file
with open('products.csv', 'w', newline='', encoding='utf-8') as csvfile:
    fieldnames = [
        'product_id', 'name', 'category', 'cost_price', 
        'selling_price', 'quantity', 'reorder_level', 'description', 'barcode'
    ]
    
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(products)

print("Generated products.csv with 100 products across different categories.")
print("Columns include: product_id, name, category, cost_price, selling_price, quantity, reorder_level, description, barcode")

# Verification that file was created
import os
if os.path.exists("products.csv"):
    print(f"File created successfully. Size: {os.path.getsize('products.csv')} bytes")
else:
    print("Error: File was not created")