"""
A simple data cleaning script for students.
This script shows how to work with CSV files without any special libraries.
"""

import csv # A built-in Python library for working with CSV files

def read_data(file_path):
    """Reads data from a CSV file and returns it as a list of lists."""
    data = []
    with open(file_path, 'r') as file:
        reader = csv.reader(file)
        for row in reader:
            data.append(row)
    return data

def remove_duplicate_rows(data):
    """Removes duplicate rows from the data."""
    unique_data = []
    # We keep the header row (the first row)
    header = data[0]
    unique_data.append(header)
    
    seen_rows = set()
    for row in data[1:]: # Start from the second row
        # We turn the row into a string to add it to our set of seen rows
        row_tuple = tuple(row)
        if row_tuple not in seen_rows:
            unique_data.append(row)
            seen_rows.add(row_tuple)
            
    return unique_data

def fill_missing_values(data):
    """Fills empty cells with 'Missing'."""
    for row in data:
        for i in range(len(row)):
            if row[i] == '':
                row[i] = 'Missing'
    return data

def save_data(data, output_path):
    """Saves the data to a new CSV file."""
    with open(output_path, 'w', newline='') as file:
        writer = csv.writer(file)
        writer.writerows(data)
    print(f"Cleaned data saved to {output_path}")

# --- Example of how to use these functions ---
if __name__ == "__main__":
    # 1. Read the data from a file named 'data.csv'
    #    Make sure you have a file with this name in the same folder.
    try:
        my_data = read_data('data.csv') 
        print("--- Original Data ---")
        for line in my_data:
            print(line)

        # 2. Clean the data
        no_duplicates = remove_duplicate_rows(my_data)
        clean_data = fill_missing_values(no_duplicates)
        
        print("\n--- Cleaned Data ---")
        for line in clean_data:
            print(line)

        # 3. Save the cleaned data to a new file
        save_data(clean_data, "cleaned_data.csv")

    except FileNotFoundError:
        print("\nError: Make sure you have a file named 'data.csv' in the same folder.")
