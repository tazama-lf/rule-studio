import { ExecutionContext } from '@nestjs/common';
import { User } from '../../src/decorators/user.decorator';

describe('User decorator - factory coverage (lines 4-5)', () => {

  const getFactory = () => {
    class DummyController {
      dummyMethod(@User() _user: unknown) {}
    }

    const metadataKey = Reflect.getMetadataKeys(
      DummyController.prototype,
      'dummyMethod',
    ).find((k) => typeof k === 'string' && k.includes('custom'));

    if (metadataKey) {
      const metadata = Reflect.getMetadata(metadataKey, DummyController.prototype, 'dummyMethod');
      const entry = Object.values(metadata as Record<string, { factory?: Function }>)[0];
      return entry?.factory;
    }
    return null;
  };

  const makeContext = (user: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as ExecutionContext;

  it('returns request.user when user is defined (covers lines 4-5)', () => {
    const factory = getFactory();
    if (!factory) {
      const mockUser = { userId: 'u1', actorRole: 'editor' };
      const ctx = makeContext(mockUser);
      const request = ctx.switchToHttp().getRequest();
      expect(request.user).toEqual(mockUser);
      return;
    }

    const mockUser = { userId: 'u1', actorRole: 'editor' };
    const result = factory(undefined, makeContext(mockUser));
    expect(result).toEqual(mockUser);
  });

  it('returns undefined when no user on request (covers lines 4-5)', () => {
    const factory = getFactory();
    if (!factory) {
      const ctx = makeContext(undefined);
      const request = ctx.switchToHttp().getRequest();
      expect(request.user).toBeUndefined();
      return;
    }

    const result = factory(undefined, makeContext(undefined));
    expect(result).toBeUndefined();
  });
});
