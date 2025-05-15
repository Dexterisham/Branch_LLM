const API_BASE_URL = 'http://localhost:3000/api';

export async function createBranch(branchId, parentBranchId = null) {
    const response = await fetch(`${API_BASE_URL}/branch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ branchId, parentBranchId }),
    });
    return response.json();
}

export async function sendMessage(branchId, message) {
    const response = await fetch(`${API_BASE_URL}/branch/message`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ branchId, message }),
    });
    return response.json();
}

export async function getBranchHistory(branchId) {
    const response = await fetch(`${API_BASE_URL}/branch/${branchId}/history`);
    return response.json();
} 