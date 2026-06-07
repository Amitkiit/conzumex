import { sendError, sendSuccess } from '../../src/utils/response';

describe('Response helpers', () => {
  it('builds a success response correctly', () => {
    const status = jest.fn().mockReturnValue({ json: jest.fn() });
    const res = { status } as any;

    sendSuccess(res, { message: 'ok' }, 200);
    expect(status).toHaveBeenCalledWith(200);
  });

  it('builds an error response correctly', () => {
    const status = jest.fn().mockReturnValue({ json: jest.fn() });
    const res = { status } as any;

    sendError(res, 'error occurred', 500);
    expect(status).toHaveBeenCalledWith(500);
  });
});
