package com.tatiekitchen.kasir;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(
    name = "BluetoothPrinter",
    permissions = {
        @Permission(
            strings = {
                Manifest.permission.BLUETOOTH_CONNECT,
                Manifest.permission.BLUETOOTH_SCAN
            },
            alias = "bluetooth"
        )
    }
)
public class BluetoothPrinterPlugin extends Plugin {
    // Standard SPP UUID for Bluetooth Classic Serial Port Profile
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private BluetoothSocket socket = null;
    private OutputStream outputStream = null;

    @PluginMethod
    public void isAvailable(PluginCall call) {
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        JSObject ret = new JSObject();
        ret.put("available", adapter != null && adapter.isEnabled());
        call.resolve(ret);
    }

    @PluginMethod
    public void listBondedDevices(PluginCall call) {
        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null) {
            call.reject("Bluetooth tidak tersedia pada perangkat ini");
            return;
        }

        JSArray devicesArray = new JSArray();
        Set<BluetoothDevice> pairedDevices = adapter.getBondedDevices();
        if (pairedDevices != null) {
            for (BluetoothDevice device : pairedDevices) {
                JSObject dev = new JSObject();
                dev.put("name", device.getName() != null ? device.getName() : "Unknown");
                dev.put("address", device.getAddress());
                devicesArray.put(dev);
            }
        }
        JSObject ret = new JSObject();
        ret.put("devices", devicesArray);
        call.resolve(ret);
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String address = call.getString("address");
        if (address == null || address.isEmpty()) {
            call.reject("Alamat MAC printer Bluetooth harus disertakan");
            return;
        }

        BluetoothAdapter adapter = BluetoothAdapter.getDefaultAdapter();
        if (adapter == null || !adapter.isEnabled()) {
            call.reject("Bluetooth belum diaktifkan pada tablet");
            return;
        }

        try {
            disconnectInternal();
            BluetoothDevice device = adapter.getRemoteDevice(address);
            adapter.cancelDiscovery();

            socket = device.createRfcommSocketToServiceRecord(SPP_UUID);
            socket.connect();
            outputStream = socket.getOutputStream();

            JSObject ret = new JSObject();
            ret.put("connected", true);
            ret.put("address", address);
            call.resolve(ret);
        } catch (Exception e) {
            disconnectInternal();
            call.reject("Gagal menghubungkan ke printer: " + e.getMessage());
        }
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        disconnectInternal();
        JSObject ret = new JSObject();
        ret.put("connected", false);
        call.resolve(ret);
    }

    @PluginMethod
    public void isConnected(PluginCall call) {
        boolean connected = socket != null && socket.isConnected();
        JSObject ret = new JSObject();
        ret.put("connected", connected);
        call.resolve(ret);
    }

    @PluginMethod
    public void printRaw(PluginCall call) {
        String base64Data = call.getString("data");
        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("Data cetak tidak boleh kosong");
            return;
        }

        if (socket == null || !socket.isConnected() || outputStream == null) {
            call.reject("Printer belum terhubung");
            return;
        }

        try {
            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
            outputStream.write(bytes);
            outputStream.flush();

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Gagal mengirim data cetak ke printer: " + e.getMessage());
        }
    }

    private void disconnectInternal() {
        try {
            if (outputStream != null) {
                outputStream.close();
                outputStream = null;
            }
            if (socket != null) {
                socket.close();
                socket = null;
            }
        } catch (IOException ignored) {}
    }
}
