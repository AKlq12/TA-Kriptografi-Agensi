<?php

namespace App\Services;

class ScytaleService
{
    /**
     * Enkripsi teks menggunakan Scytale Transposition.
     * Kunci (key) adalah jumlah baris (diameter silinder).
     */
    public function encrypt(string $plaintext, int $key_rows): string
    {
        if ($key_rows <= 1) {
            return $plaintext;
        }

        $textLength = strlen($plaintext);
        $numCols = (int)ceil($textLength / $key_rows);

        // Buat grid (matriks)
        $grid = array_fill(0, $key_rows, array_fill(0, $numCols, ' '));
        $k = 0;

        // 1. Tulis pesan ke grid (baris demi baris)
        for ($r = 0; $r < $key_rows; $r++) {
            for ($c = 0; $c < $numCols; $c++) {
                if ($k < $textLength) {
                    $grid[$r][$c] = $plaintext[$k++];
                }
            }
        }

        // 2. Baca pesan dari grid (kolom demi kolom)
        $ciphertext = '';
        for ($c = 0; $c < $numCols; $c++) {
            for ($r = 0; $r < $key_rows; $r++) {
                $ciphertext .= $grid[$r][$c];
            }
        }

        return $ciphertext;
    }

    /**
     * Dekripsi teks Scytale.
     * Kunci (key) adalah jumlah baris (diameter silinder) yang SAMA.
     */
    public function decrypt(string $ciphertext, int $key_rows): string
    {
        if ($key_rows <= 1) {
            return $ciphertext;
        }

        $textLength = strlen($ciphertext);
        $numRows = $key_rows;
        $numCols = (int)ceil($textLength / $numRows);

        // Buat grid (matriks)
        $grid = array_fill(0, $numRows, array_fill(0, $numCols, ' '));
        $k = 0;

        // 1. Tulis ciphertext ke grid (kolom demi kolom)
        for ($c = 0; $c < $numCols; $c++) {
            for ($r = 0; $r < $numRows; $r++) {
                if ($k < $textLength) {
                    $grid[$r][$c] = $ciphertext[$k++];
                }
            }
        }

        // 2. Baca pesan dari grid (baris demi baris)
        $plaintext = '';
        for ($r = 0; $r < $numRows; $r++) {
            for ($c = 0; $c < $numCols; $c++) {
                $plaintext .= $grid[$r][$c];
            }
        }

        // Hapus spasi padding di akhir
        return trim($plaintext);
    }
}