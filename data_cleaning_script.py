import os
import pandas as pd
import glob

# Path to your raw results
BASE_DIR = "/Users/barnetthan/Desktop/frontend-framework-energy-efficiency"
RAW_DIR = os.path.join(BASE_DIR, "real-csv-results")
PROCESSED_DIR = os.path.join(BASE_DIR, "processed-csv-results")

def process_results():
    # Create the processed folder if it doesn't exist
    if not os.path.exists(PROCESSED_DIR):
        os.makedirs(PROCESSED_DIR)
        print(f"Created directory: {PROCESSED_DIR}")

    # Find all CSV files in the raw folder
    csv_files = glob.glob(os.path.join(RAW_DIR, "*.csv"))
    
    if not csv_files:
        print(f"No CSV files found in {RAW_DIR}")
        return

    print(f"{'File Name':<40} | {'Original':<8} | {'Cleaned':<8} | {'Mean':<10} | {'StdDev'}")
    print("-" * 85)

    for file_path in csv_files:
        file_name = os.path.basename(file_path)
        
        try:
            # Load raw data
            df = pd.read_csv(file_path, names=['energy'])
            
            if df.empty:
                continue

            # --- IQR Logic ---
            Q1 = df['energy'].quantile(0.25)
            Q3 = df['energy'].quantile(0.75)
            IQR = Q3 - Q1
            
            # Standard 1.5x IQR rule
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            # Filter the data
            cleaned_df = df[(df['energy'] >= lower_bound) & (df['energy'] <= upper_bound)]
            
            # --- Saving ---
            # Save the clean version to the NEW folder
            # Naming it the same as original for easier batch processing later
            save_path = os.path.join(PROCESSED_DIR, file_name)
            cleaned_df.to_csv(save_path, index=False, header=False)

            # --- Stats for your report ---
            mean_val = cleaned_df['energy'].mean()
            std_val = cleaned_df['energy'].std()
            
            print(f"{file_name:<40} | {len(df):<8} | {len(cleaned_df):<8} | {mean_val:>8.2f} | {std_val:>8.2f}")

        except Exception as e:
            print(f"Error processing {file_name}: {e}")

if __name__ == "__main__":
    process_results()